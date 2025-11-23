import { format, parseISO } from 'date-fns';

export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    try {
        return format(dateObj, formatStr);
    } catch (error) {
        console.error('Error formatting date:', error);
        return String(date);
    }
}

export function formatDateTime(date: string | Date): string {
    return formatDate(date, 'PPP p');
}

export function formatRelativeTime(date: string | Date): string {
    // We can add relative time formatting later if needed, 
    // for now just return standard date time
    return formatDateTime(date);
}
