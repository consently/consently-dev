import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
    const spec = createSwaggerSpec({
        apiFolder: 'app/api', // define api folder
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Consently API',
                version: '1.0.0',
                description: 'API documentation for Consently platform',
            },
            security: [],
        },
    });
    return spec;
};
