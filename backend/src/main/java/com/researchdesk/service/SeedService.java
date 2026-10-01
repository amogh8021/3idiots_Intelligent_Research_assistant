package com.researchdesk.service;

import com.researchdesk.entity.Document;
import com.researchdesk.entity.DocumentChunk;
import com.researchdesk.entity.DocumentStatus;
import com.researchdesk.repository.DocumentChunkRepository;
import com.researchdesk.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SeedService {

    private static final Logger log = LoggerFactory.getLogger(SeedService.class);

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final AiService aiService;

    public SeedService(
            DocumentRepository documentRepository,
            DocumentChunkRepository documentChunkRepository,
            AiService aiService) {
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.aiService = aiService;
    }

    @Transactional
    public List<Document> seedSamplePapersForUser(UUID userId) {
        log.info("Seeding curated academic research papers for user {}", userId);

        List<Document> papers = new ArrayList<>();

        // Paper 1: Attention Is All You Need
        String doc1Content = "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.";
        Document doc1 = Document.builder()
                .userId(userId)
                .fileName("Attention_Is_All_You_Need_Vaswani2017.pdf")
                .blobName(UUID.randomUUID() + "-Attention_Is_All_You_Need_Vaswani2017.pdf")
                .fileSize(2211840L)
                .fileType("application/pdf")
                .status(DocumentStatus.READY)
                .pageCount(15)
                .uploadedAt(LocalDateTime.now().minusHours(3))
                .processedAt(LocalDateTime.now().minusHours(3))
                .build();
        doc1 = documentRepository.save(doc1);
        papers.add(doc1);

        documentChunkRepository.save(DocumentChunk.builder()
                .documentId(doc1.getId())
                .chunkIndex(0)
                .pageNumber(1)
                .content(doc1Content)
                .build());

        aiService.indexDocumentWithContent(doc1.getId(), doc1Content);

        // Paper 2: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
        String doc2Content = "Large pre-trained language models store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and they fall short on knowledge-intensive tasks. In this work, we explore general-purpose fine-tuning recipes for retrieval-augmented generation (RAG)—models which combine pre-trained parametric and non-parametric memory for language generation. We introduce RAG models where the parametric memory is a pre-trained seq2seq model and the non-parametric memory is a dense vector index of Wikipedia, accessed with a pre-trained neural retriever. We compare two RAG formulations: one that conditions on the same retrieved passages across the whole generated sequence, and one that can use different passages per token.";
        Document doc2 = Document.builder()
                .userId(userId)
                .fileName("Retrieval_Augmented_Generation_Lewis2020.pdf")
                .blobName(UUID.randomUUID() + "-Retrieval_Augmented_Generation_Lewis2020.pdf")
                .fileSize(1450000L)
                .fileType("application/pdf")
                .status(DocumentStatus.READY)
                .pageCount(12)
                .uploadedAt(LocalDateTime.now().minusHours(2))
                .processedAt(LocalDateTime.now().minusHours(2))
                .build();
        doc2 = documentRepository.save(doc2);
        papers.add(doc2);

        documentChunkRepository.save(DocumentChunk.builder()
                .documentId(doc2.getId())
                .chunkIndex(0)
                .pageNumber(2)
                .content(doc2Content)
                .build());

        aiService.indexDocumentWithContent(doc2.getId(), doc2Content);

        // Paper 3: Deep Residual Learning for Image Recognition
        String doc3Content = "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with a depth of up to 152 layers—8x deeper than VGG nets but still having lower complexity. An ensemble of these residual nets achieves 3.57% error on the ImageNet test set, winning 1st place in ILSVRC 2015.";
        Document doc3 = Document.builder()
                .userId(userId)
                .fileName("Deep_Residual_Learning_He2016.pdf")
                .blobName(UUID.randomUUID() + "-Deep_Residual_Learning_He2016.pdf")
                .fileSize(3100000L)
                .fileType("application/pdf")
                .status(DocumentStatus.READY)
                .pageCount(28)
                .uploadedAt(LocalDateTime.now().minusHours(1))
                .processedAt(LocalDateTime.now().minusHours(1))
                .build();
        doc3 = documentRepository.save(doc3);
        papers.add(doc3);

        documentChunkRepository.save(DocumentChunk.builder()
                .documentId(doc3.getId())
                .chunkIndex(0)
                .pageNumber(3)
                .content(doc3Content)
                .build());

        aiService.indexDocumentWithContent(doc3.getId(), doc3Content);

        log.info("Successfully seeded 3 academic papers and indexed chunks in AI service for user {}", userId);
        return papers;
    }
}
