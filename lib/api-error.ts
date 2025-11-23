import { NextResponse } from 'next/server';
import { errorResponse } from './api-response';
import { ZodError } from 'zod';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR', isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof AppError) {
        return errorResponse(error.message, error.code, error.statusCode);
    }

    if (error instanceof ZodError) {
        return errorResponse('Validation Error', 'VALIDATION_ERROR', 400, error.issues);
    }

    if (error instanceof Error) {
        // Handle specific known errors here if needed
        return errorResponse(error.message, 'INTERNAL_SERVER_ERROR', 500);
    }

    return errorResponse('An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500);
}
