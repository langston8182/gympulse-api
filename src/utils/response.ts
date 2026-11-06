import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export function success<T>(statusCode: number, data: T): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(data),
  };
}

export function error(statusCode: number, message: string, details?: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify({ message, details }),
  };
}

export function noContent(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 204,
    headers: defaultHeaders,
    body: '',
  };
}
