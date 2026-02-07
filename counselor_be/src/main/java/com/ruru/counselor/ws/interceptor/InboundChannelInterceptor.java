package com.ruru.counselor.ws.interceptor;

import com.ruru.counselor.ws.strategy.RoleMessageStrategy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class InboundChannelInterceptor implements ChannelInterceptor {

	private final Map<String, RoleMessageStrategy> strategies = new HashMap<>();

	public InboundChannelInterceptor(List<RoleMessageStrategy> strategies) {
		for (RoleMessageStrategy strategy : strategies) {
			this.strategies.put(strategy.role(), strategy);
		}
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null) {
			return message;
		}

		if (accessor.getCommand() == StompCommand.CONNECT) {
			String role = accessor.getFirstNativeHeader("role");
			if (role != null) {
				Map<String, Object> attributes = accessor.getSessionAttributes();
				if (attributes != null) {
					attributes.put("role", role);
				}
			}
			return message;
		}

		if (accessor.getCommand() == StompCommand.SEND) {
			RoleMessageStrategy strategy = resolveStrategy(accessor);
			if (strategy != null) {
				strategy.handlePreSend(accessor);
			}
		}

		return message;
	}

	@Override
	public void postSend(Message<?> message, MessageChannel channel, boolean sent) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null) {
			return;
		}

		if (accessor.getCommand() == StompCommand.MESSAGE) {
			RoleMessageStrategy strategy = resolveStrategy(accessor);
			if (strategy != null) {
				strategy.handlePostSend(accessor);
			}
		}
	}

	private RoleMessageStrategy resolveStrategy(StompHeaderAccessor accessor) {
		String role = resolveRole(accessor);
		if (role == null) {
			return null;
		}
		return strategies.get(role);
	}

	private String resolveRole(StompHeaderAccessor accessor) {
		Map<String, Object> attributes = accessor.getSessionAttributes();
		if (attributes != null) {
			Object roleAttr = attributes.get("role");
			if (roleAttr instanceof String) {
				return (String) roleAttr;
			}
		}

		String destination = accessor.getDestination();
		if (destination == null) {
			return null;
		}
		if (destination.startsWith("/app/customer") || destination.startsWith("/topic/customer")) {
			return "customer";
		}
		if (destination.startsWith("/app/counselor") || destination.startsWith("/topic/counselor")) {
			return "counselor";
		}
		return null;
	}
}
