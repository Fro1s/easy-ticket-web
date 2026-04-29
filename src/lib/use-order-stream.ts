'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getOrdersControllerFindOneQueryKey } from '@/generated/api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OrderStreamMessage {
  type: 'status' | 'ping';
  orderId?: string;
  status?: string;
  paidAt?: string | null;
}

/**
 * Subscribe to SSE stream for an order. On every status event we invalidate the
 * React Query cache for `findOne(orderId)` — the existing useEffect on the page
 * handles the redirect when status flips to PAID.
 *
 * `enabled=false` (or null orderId) skips the subscription. Pass `false` once
 * the order is in a terminal state to avoid reconnect churn.
 */
export function useOrderStream(orderId: string | null | undefined, enabled = true): void {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!enabled || !orderId) return;
    if (typeof EventSource === 'undefined') return;

    const url = `${API_BASE}/api/v1/orders/${orderId}/events`;
    const es = new EventSource(url);

    es.onmessage = (ev) => {
      let msg: OrderStreamMessage | null = null;
      try {
        msg = JSON.parse(ev.data) as OrderStreamMessage;
      } catch {
        return;
      }
      if (!msg || msg.type !== 'status') return;
      queryClient.invalidateQueries({
        queryKey: getOrdersControllerFindOneQueryKey(orderId),
      });
    };

    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do unless it's permanently
      // closed (CLOSED state). We let the browser handle backoff.
    };

    return () => {
      es.close();
    };
  }, [orderId, enabled, queryClient]);
}
