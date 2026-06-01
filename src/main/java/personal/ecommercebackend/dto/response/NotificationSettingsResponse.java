package personal.ecommercebackend.dto.response;

public record NotificationSettingsResponse(
        boolean orderNotificationsEnabled,
        boolean productNotificationsEnabled,
        boolean realtimeNotificationsEnabled
) {}
