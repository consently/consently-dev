import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update'
  | 'user.delete'
  | 'subscription.create'
  | 'subscription.update'
  | 'subscription.cancel'
  | 'banner.create'
  | 'banner.update'
  | 'banner.delete'
  | 'widget.create'
  | 'widget.update'
  | 'widget.delete'
  | 'consent.record'
  | 'consent.revoke'
  | 'cookie.scan'
  | 'cookie_created'
  | 'cookie_updated'
  | 'cookie_deleted'
  | 'cookie_bulk_imported'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'categories_bulk_created'
  | 'banner_configured'
  | 'translation_created'
  | 'translation_updated'
  | 'compliance_check_run'
  | 'analytics_exported'
  | 'activity.create'
  | 'activity.update'
  | 'activity.delete'
  | 'email.send';

export type AuditStatus = 'success' | 'failure';

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: AuditStatus;
  errorMessage?: string;
}

/**
 * Create an audit log entry
 * Uses service role client to bypass RLS when needed
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Try with regular client first (respects user context)
    let supabase = await createClient();
    
    // If no userId, use service role client to bypass RLS
    // This ensures system logs and logs without user context can be created
    if (!data.userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    const { error, data: insertedData } = await supabase
      .from('audit_logs')
      .insert({
        user_id: data.userId || null,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId || null,
        changes: data.changes || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        status: data.status,
        error_message: data.errorMessage || null
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create audit log:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        action: data.action,
        resourceType: data.resourceType,
        userId: data.userId
      });
      
      // If regular client fails and we have service role, try with service role
      if (error.code === '42501' && process.env.SUPABASE_SERVICE_ROLE_KEY && data.userId) {
        console.log('Retrying audit log creation with service role client...');
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { error: serviceError } = await serviceSupabase
          .from('audit_logs')
          .insert({
            user_id: data.userId || null,
            action: data.action,
            resource_type: data.resourceType,
            resource_id: data.resourceId || null,
            changes: data.changes || null,
            ip_address: data.ipAddress || null,
            user_agent: data.userAgent || null,
            status: data.status,
            error_message: data.errorMessage || null
          });
          
        if (serviceError) {
          console.error('Failed to create audit log with service role:', serviceError);
        }
      }
    } else {
      // Log success in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Audit log created successfully:', {
          id: insertedData?.id,
          action: data.action,
          resourceType: data.resourceType
        });
      }
    }
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  );
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}

/**
 * Helper function to log successful actions
 */
export async function logSuccess(
  userId: string,
  action: AuditAction,
  resourceType: string,
  resourceId?: string,
  changes?: Record<string, any>,
  request?: Request
): Promise<void> {
  const ipAddress = request ? getIpAddress(request.headers) : undefined;
  const userAgent = request ? getUserAgent(request.headers) : undefined;

  await createAuditLog({
    userId,
    action,
    resourceType,
    resourceId,
    changes,
    ipAddress,
    userAgent,
    status: 'success'
  });
}

/**
 * Helper function to log failed actions
 */
export async function logFailure(
  userId: string | undefined,
  action: AuditAction,
  resourceType: string,
  errorMessage: string,
  request?: Request
): Promise<void> {
  const ipAddress = request ? getIpAddress(request.headers) : undefined;
  const userAgent = request ? getUserAgent(request.headers) : undefined;

  await createAuditLog({
    userId,
    action,
    resourceType,
    ipAddress,
    userAgent,
    status: 'failure',
    errorMessage
  });
}

/**
 * General purpose audit logging function
 * Used throughout the application for consistent audit logging
 */
export async function logAudit(params: {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  error_message?: string;
}): Promise<void> {
  await createAuditLog({
    userId: params.user_id,
    action: params.action as AuditAction,
    resourceType: params.resource_type,
    resourceId: params.resource_id,
    changes: params.changes,
    ipAddress: params.ip_address,
    userAgent: params.user_agent,
    status: params.status,
    errorMessage: params.error_message,
  });
}
