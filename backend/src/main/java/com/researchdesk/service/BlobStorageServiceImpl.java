package com.researchdesk.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.researchdesk.exception.AzureStorageException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Service
public class BlobStorageServiceImpl implements BlobStorageService {

    private static final Logger log = LoggerFactory.getLogger(BlobStorageServiceImpl.class);

    @Value("${azure.storage.connection-string:}")
    private String connectionString;

    @Value("${azure.storage.container-name:research-documents}")
    private String containerName;

    private BlobContainerClient containerClient;

    @PostConstruct
    public void init() {
        if (connectionString == null || connectionString.trim().isEmpty()) {
            String errorMsg = "Azure Storage connection string is not configured. Please set AZURE_STORAGE_CONNECTION_STRING.";
            log.error(errorMsg);
            throw new AzureStorageException(errorMsg);
        }

        try {
            BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                    .connectionString(connectionString.trim())
                    .buildClient();

            this.containerClient = serviceClient.getBlobContainerClient(containerName);
            if (!this.containerClient.exists()) {
                this.containerClient.create();
                log.info("Successfully created Azure Blob Container: '{}'", containerName);
            } else {
                log.info("Connected to existing Azure Blob Container: '{}'", containerName);
            }
        } catch (Exception e) {
            String errorMsg = "Failed to initialize Azure Blob Storage client for container '" + containerName + "': " + e.getMessage();
            log.error(errorMsg, e);
            throw new AzureStorageException(errorMsg, e);
        }
    }

    private void ensureContainerClient() {
        if (containerClient == null) {
            throw new AzureStorageException("Azure Blob Storage is not initialized or container client is null.");
        }
    }

    @Override
    public void upload(MultipartFile file, String blobName) {
        if (file == null || file.isEmpty()) {
            throw new AzureStorageException("Cannot upload empty or null file to Azure Blob Storage");
        }
        ensureContainerClient();

        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            try (InputStream inputStream = file.getInputStream()) {
                blobClient.upload(inputStream, file.getSize(), true);
            }
            if (file.getContentType() != null) {
                BlobHttpHeaders headers = new BlobHttpHeaders().setContentType(file.getContentType());
                blobClient.setHttpHeaders(headers);
            }
            log.info("Successfully uploaded blob '{}' (size: {} bytes) to Azure container '{}'",
                    blobName, file.getSize(), containerName);
        } catch (Exception e) {
            log.error("Failed to upload blob '{}' to Azure Blob Storage: {}", blobName, e.getMessage());
            throw new AzureStorageException("Failed to upload blob '" + blobName + "' to Azure Blob Storage", e);
        }
    }

    @Override
    public void uploadBytes(byte[] bytes, String blobName, String contentType) {
        if (bytes == null || bytes.length == 0) {
            throw new AzureStorageException("Cannot upload empty byte array to Azure Blob Storage");
        }
        ensureContainerClient();

        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            try (InputStream inputStream = new ByteArrayInputStream(bytes)) {
                blobClient.upload(inputStream, bytes.length, true);
            }
            if (contentType != null) {
                BlobHttpHeaders headers = new BlobHttpHeaders().setContentType(contentType);
                blobClient.setHttpHeaders(headers);
            }
            log.info("Successfully uploaded blob bytes for '{}' (size: {} bytes) to Azure container '{}'",
                    blobName, bytes.length, containerName);
        } catch (Exception e) {
            log.error("Failed to upload blob bytes '{}' to Azure Blob Storage: {}", blobName, e.getMessage());
            throw new AzureStorageException("Failed to upload blob bytes '" + blobName + "' to Azure Blob Storage", e);
        }
    }

    @Override
    public void delete(String blobName) {
        ensureContainerClient();
        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            boolean deleted = blobClient.deleteIfExists();
            if (deleted) {
                log.info("Successfully deleted blob '{}' from Azure container '{}'", blobName, containerName);
            } else {
                log.warn("Blob '{}' did not exist in Azure container '{}'", blobName, containerName);
            }
        } catch (Exception e) {
            log.error("Failed to delete blob '{}' from Azure Blob Storage: {}", blobName, e.getMessage());
            throw new AzureStorageException("Failed to delete blob '" + blobName + "' from Azure Blob Storage", e);
        }
    }

    @Override
    public boolean exists(String blobName) {
        ensureContainerClient();
        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            return blobClient.exists();
        } catch (Exception e) {
            log.error("Failed to check existence for blob '{}' in Azure Blob Storage: {}", blobName, e.getMessage());
            throw new AzureStorageException("Failed to check existence of blob '" + blobName + "'", e);
        }
    }

    @Override
    public byte[] download(String blobName) {
        ensureContainerClient();
        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            if (!blobClient.exists()) {
                throw new AzureStorageException("Blob '" + blobName + "' not found in Azure container '" + containerName + "'");
            }
            return blobClient.downloadContent().toBytes();
        } catch (Exception e) {
            log.error("Failed to download blob '{}' from Azure Blob Storage: {}", blobName, e.getMessage());
            throw new AzureStorageException("Failed to download blob '" + blobName + "' from Azure Blob Storage", e);
        }
    }

    @Override
    public InputStream openInputStream(String blobName) {
        ensureContainerClient();
        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            if (!blobClient.exists()) {
                throw new AzureStorageException("Blob '" + blobName + "' not found in Azure container '" + containerName + "'");
            }
            return blobClient.openInputStream();
        } catch (Exception e) {
            log.error("Failed to open input stream for blob '{}' from Azure Blob Storage: {}", blobName, e.getMessage());
            throw new AzureStorageException("Failed to open input stream for blob '" + blobName + "'", e);
        }
    }
}
