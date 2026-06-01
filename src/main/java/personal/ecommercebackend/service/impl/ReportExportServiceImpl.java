package personal.ecommercebackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.OrderItem;
import personal.ecommercebackend.entity.OrderStatus;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductVariant;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.service.ReportExportService;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportExportServiceImpl implements ReportExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss 'UTC'")
            .withZone(ZoneOffset.UTC);

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public String exportOrdersCsv(Instant from, Instant to, OrderStatus status) {
        List<Order> orders = orderRepository.findForReport(from, to, status);
        StringBuilder csv = new StringBuilder();
        appendRow(csv, List.of(
                "Order ID", "Status", "Customer Email", "Customer Name", "Subtotal", "Discount", "Shipping",
                "Tax", "Total", "Refunded", "Coupon", "Shipping Method", "Shipping Address", "Items", "Created At"
        ));
        for (Order order : orders) {
            User user = order.getUser();
            appendRow(csv, List.of(
                    order.getId(),
                    order.getStatus(),
                    user.getEmail(),
                    user.getFirstName() + " " + user.getLastName(),
                    money(order.getSubtotalAmount()),
                    money(order.getDiscountAmount()),
                    money(order.getShippingCost()),
                    money(order.getTaxAmount()),
                    money(order.getTotalAmount()),
                    money(order.getRefundedAmount()),
                    value(order.getCouponCode()),
                    value(order.getShippingMethod()),
                    shippingAddress(order),
                    itemSummary(order),
                    formatInstant(order.getCreatedAt())
            ));
        }
        return csv.toString();
    }

    @Override
    public String exportCustomersCsv(Instant from, Instant to, String status) {
        List<User> users = userRepository.findCustomersForReport(from, to, normalize(status));
        Map<Long, CustomerTotals> totals = new LinkedHashMap<>();
        for (Order order : orderRepository.findForReport(null, null, null)) {
            CustomerTotals current = totals.computeIfAbsent(order.getUser().getId(), ignored -> new CustomerTotals());
            current.orderCount++;
            current.lifetimeSpend = current.lifetimeSpend.add(nullToZero(order.getTotalAmount()));
        }

        StringBuilder csv = new StringBuilder();
        appendRow(csv, List.of(
                "Customer ID", "Email", "First Name", "Last Name", "Mobile", "Status", "Segment", "Role",
                "Order Count", "Lifetime Spend", "Created At", "Updated At"
        ));
        for (User user : users) {
            CustomerTotals customerTotals = totals.getOrDefault(user.getId(), new CustomerTotals());
            appendRow(csv, List.of(
                    user.getId(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    value(user.getMobileNumber()),
                    user.isBlocked() ? "BLOCKED" : "ACTIVE",
                    value(user.getCustomerSegment()),
                    user.getRole(),
                    customerTotals.orderCount,
                    money(customerTotals.lifetimeSpend),
                    formatInstant(user.getCreatedAt()),
                    formatInstant(user.getUpdatedAt())
            ));
        }
        return csv.toString();
    }

    @Override
    public String exportProductsCsv(Instant from, Instant to, String status) {
        List<Product> products = productRepository.findForReport(from, to, normalize(status));
        StringBuilder csv = new StringBuilder();
        appendRow(csv, List.of(
                "Product ID", "Variant ID", "Name", "Variant", "SKU", "Category", "Price", "Stock",
                "Status", "Featured", "Visible From", "Visible Until", "Created At", "Updated At"
        ));
        for (Product product : products) {
            if (product.getVariants().isEmpty()) {
                appendProductRow(csv, product, null);
            } else {
                for (ProductVariant variant : product.getVariants()) {
                    appendProductRow(csv, product, variant);
                }
            }
        }
        return csv.toString();
    }

    @Override
    public byte[] invoicePdf(Long orderId) {
        Order order = orderRepository.findWithDetailsById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        List<String> lines = new ArrayList<>();
        User customer = order.getUser();
        lines.add("Invoice / Receipt");
        lines.add("Order #" + order.getId());
        lines.add("Date: " + formatInstant(order.getCreatedAt()));
        lines.add("Status: " + order.getStatus());
        lines.add("");
        lines.add("Customer");
        lines.add(customer.getFirstName() + " " + customer.getLastName());
        lines.add(customer.getEmail());
        lines.add("");
        lines.add("Ship To");
        lines.add(shippingAddress(order));
        lines.add("");
        lines.add("Items");
        for (OrderItem item : order.getItems()) {
            BigDecimal lineTotal = nullToZero(item.getUnitPrice()).multiply(BigDecimal.valueOf(item.getQuantity()));
            lines.add(item.getQuantity() + " x " + item.getProductName()
                    + (item.getVariantName() == null ? "" : " - " + item.getVariantName())
                    + " @ $" + money(item.getUnitPrice()) + " = $" + money(lineTotal));
        }
        lines.add("");
        lines.add("Subtotal: $" + money(order.getSubtotalAmount()));
        lines.add("Discount: $" + money(order.getDiscountAmount()));
        lines.add("Shipping: $" + money(order.getShippingCost()));
        lines.add("Tax: $" + money(order.getTaxAmount()));
        lines.add("Total: $" + money(order.getTotalAmount()));
        if (order.getRefundedAmount().compareTo(BigDecimal.ZERO) > 0) {
            lines.add("Refunded: $" + money(order.getRefundedAmount()));
        }
        return SimplePdf.create("invoice-" + order.getId(), lines);
    }

    private void appendProductRow(StringBuilder csv, Product product, ProductVariant variant) {
        boolean active = variant == null ? product.isActive() : product.isActive() && variant.isActive();
        appendRow(csv, List.of(
                product.getId(),
                variant == null ? "" : variant.getId(),
                product.getName(),
                variant == null ? "" : value(variant.displayName()),
                variant == null ? value(product.getSku()) : value(variant.getSku()),
                product.getCategory().getName(),
                money(product.getPrice()),
                variant == null ? product.getStockQuantity() : variant.getStockQuantity(),
                active ? "ACTIVE" : "INACTIVE",
                product.isFeatured() ? "YES" : "NO",
                formatInstant(product.getVisibleFrom()),
                formatInstant(product.getVisibleUntil()),
                formatInstant(product.getCreatedAt()),
                formatInstant(product.getUpdatedAt())
        ));
    }

    private static void appendRow(StringBuilder csv, List<?> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(escapeCsv(value(values.get(i))));
        }
        csv.append('\n');
    }

    private static String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private static String shippingAddress(Order order) {
        return String.join(", ",
                order.getShippingStreet(),
                order.getShippingCity(),
                value(order.getShippingState()),
                order.getShippingZipCode(),
                order.getShippingCountry());
    }

    private static String itemSummary(Order order) {
        List<String> items = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            items.add(item.getQuantity() + "x " + item.getProductName()
                    + (item.getVariantName() == null ? "" : " (" + item.getVariantName() + ")"));
        }
        return String.join("; ", items);
    }

    private static String formatInstant(Instant value) {
        return value == null ? "" : DATE_FORMATTER.format(value);
    }

    private static String money(BigDecimal value) {
        return nullToZero(value).toPlainString();
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private static String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static final class CustomerTotals {
        private int orderCount;
        private BigDecimal lifetimeSpend = BigDecimal.ZERO;
    }

    private static final class SimplePdf {
        private SimplePdf() {
        }

        static byte[] create(String title, List<String> rawLines) {
            List<String> lines = rawLines.stream()
                    .flatMap(line -> wrap(line, 88).stream())
                    .toList();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            List<Integer> offsets = new ArrayList<>();
            write(out, "%PDF-1.4\n");
            writeObject(out, offsets, 1, "<< /Type /Catalog /Pages 2 0 R >>");
            writeObject(out, offsets, 2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
            writeObject(out, offsets, 3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                    + "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>");
            writeObject(out, offsets, 4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
            String content = contentStream(title, lines);
            offsets.add(out.size());
            write(out, "5 0 obj\n<< /Length " + content.getBytes(StandardCharsets.US_ASCII).length + " >>\nstream\n");
            write(out, content);
            write(out, "endstream\nendobj\n");
            int xref = out.size();
            write(out, "xref\n0 6\n0000000000 65535 f \n");
            for (Integer offset : offsets) {
                write(out, String.format("%010d 00000 n \n", offset));
            }
            write(out, "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");
            return out.toByteArray();
        }

        private static String contentStream(String title, List<String> lines) {
            StringBuilder content = new StringBuilder("BT\n/F1 18 Tf\n50 742 Td\n(")
                    .append(pdfEscape(title))
                    .append(") Tj\n/F1 10 Tf\n0 -28 Td\n");
            int printed = 0;
            for (String line : lines) {
                if (printed++ >= 48) {
                    content.append("(...) Tj\n0 -14 Td\n");
                    break;
                }
                content.append('(').append(pdfEscape(line)).append(") Tj\n0 -14 Td\n");
            }
            content.append("ET\n");
            return content.toString();
        }

        private static List<String> wrap(String line, int width) {
            if (line == null || line.length() <= width) {
                return List.of(value(line));
            }
            List<String> parts = new ArrayList<>();
            String remaining = line;
            while (remaining.length() > width) {
                int split = remaining.lastIndexOf(' ', width);
                if (split < 20) {
                    split = width;
                }
                parts.add(remaining.substring(0, split));
                remaining = remaining.substring(split).trim();
            }
            parts.add(remaining);
            return parts;
        }

        private static void writeObject(ByteArrayOutputStream out, List<Integer> offsets, int number, String body) {
            offsets.add(out.size());
            write(out, number + " 0 obj\n" + body + "\nendobj\n");
        }

        private static void write(ByteArrayOutputStream out, String value) {
            out.writeBytes(value.getBytes(StandardCharsets.US_ASCII));
        }

        private static String pdfEscape(String value) {
            return value(value)
                    .replace("\\", "\\\\")
                    .replace("(", "\\(")
                    .replace(")", "\\)")
                    .replaceAll("[^\\x20-\\x7E]", "?");
        }
    }
}
