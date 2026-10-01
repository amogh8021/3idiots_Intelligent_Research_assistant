package com.researchdesk.exception;

public class AzureStorageException extends RuntimeException {
    public AzureStorageException(String message) {
        super(message);
    }

    public AzureStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
