package personal.ecommercebackend.dto.request;

public record NotificationSettingsRequest(
        Boolean orderNotificationsEnabled,
        Boolean productNotificationsEnabled,
        Boolean realtimeNotificationsEnabled
) {}
