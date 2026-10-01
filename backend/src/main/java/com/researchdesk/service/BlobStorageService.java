package com.researchdesk.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface BlobStorageService {
    void upload(MultipartFile file, String blobName);
    void uploadBytes(byte[] bytes, String blobName, String contentType);
    void delete(String blobName);
    boolean exists(String blobName);
    byte[] download(String blobName);
    InputStream openInputStream(String blobName);
}
