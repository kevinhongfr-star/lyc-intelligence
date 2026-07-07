import { supabase } from './client';

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  new: Record<string, any> | null;
  old: Record<string, any> | null;
  errors: any[] | null;
}

export const subscribeToPipeline = (
  mandateId: string,
  callback: (payload: RealtimePayload) => void
) => {
  return supabase
    .channel(`pipeline:${mandateId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'candidates_pipeline',
        filter: `mandate_id=eq.${mandateId}`,
      },
      callback as any
    )
    .subscribe();
};

export const subscribeToSignals = (
  entityType: string,
  entityId: string,
  callback: (payload: RealtimePayload) => void
) => {
  return supabase
    .channel(`signals:${entityType}:${entityId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'signals',
        filter: `target_entity_id=eq.${entityId}`,
      },
      callback as any
    )
    .subscribe();
};

export const subscribeToChat = (
  conversationId: string,
  callback: (payload: RealtimePayload) => void
) => {
  return supabase
    .channel(`chat:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback as any
    )
    .subscribe();
};

export const subscribeToMandateChanges = (
  mandateId: string,
  callback: (payload: RealtimePayload) => void
) => {
  return supabase
    .channel(`mandate:${mandateId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mandates',
        filter: `id=eq.${mandateId}`,
      },
      callback as any
    )
    .subscribe();
};

export const subscribeToNotifications = (
  userId: string,
  callback: (payload: RealtimePayload) => void
) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback as any
    )
    .subscribe();
};

export const unsubscribeFromChannel = (channel: any) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
