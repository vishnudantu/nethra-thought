type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal';

export function statusBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    'Resolved': 'success', 'Completed': 'success', 'Active': 'success', 'Sent': 'success',
    'In Progress': 'info', 'Ongoing': 'info',
    'Pending': 'warning', 'Upcoming': 'warning', 'Tendering': 'warning', 'Scheduled': 'warning',
    'Escalated': 'danger', 'Cancelled': 'danger', 'Failed': 'danger', 'Stalled': 'danger',
    'Closed': 'neutral', 'Inactive': 'neutral', 'Draft': 'neutral', 'On Leave': 'neutral',
    'Planning': 'teal',
  };
  return map[status] || 'neutral';
}

export function priorityBadge(priority: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    'Low': 'success', 'Medium': 'warning', 'High': 'danger', 'Urgent': 'danger',
  };
  return map[priority] || 'neutral';
}
