export const formatTimeWithTimezone = (
  iso: string,
  timezone: string | null | undefined
) => {
  if (!iso) return '';

  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || 'UTC',
    });
  } catch (e) {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
};