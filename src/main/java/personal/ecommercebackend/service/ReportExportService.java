package personal.ecommercebackend.service;

import personal.ecommercebackend.entity.OrderStatus;

import java.time.Instant;

public interface ReportExportService {
    String exportOrdersCsv(Instant from, Instant to, OrderStatus status);

    String exportCustomersCsv(Instant from, Instant to, String status);

    String exportProductsCsv(Instant from, Instant to, String status);

    byte[] invoicePdf(Long orderId);
}
