package com.ruru.counselor.ws.strategy;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

public interface RoleMessageStrategy {

	String role();

	void handlePreSend(StompHeaderAccessor accessor);

	void handlePostSend(StompHeaderAccessor accessor);
}
