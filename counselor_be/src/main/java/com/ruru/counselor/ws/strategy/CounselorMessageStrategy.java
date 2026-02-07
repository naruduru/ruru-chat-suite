package com.ruru.counselor.ws.strategy;

import com.ruru.counselor.config.RabbitConfig;
import com.ruru.counselor.ws.dto.WsInterceptorEvent;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class CounselorMessageStrategy implements RoleMessageStrategy {

	private static final Logger log = LoggerFactory.getLogger(CounselorMessageStrategy.class);
	private final RabbitTemplate rabbitTemplate;

	public CounselorMessageStrategy(RabbitTemplate rabbitTemplate) {
		this.rabbitTemplate = rabbitTemplate;
	}

	@Override
	public String role() {
		return "counselor";
	}

	@Override
	public void handlePreSend(StompHeaderAccessor accessor) {
		WsInterceptorEvent event = new WsInterceptorEvent(
				role(),
				"PRESEND",
				accessor.getDestination(),
				accessor.getSessionId(),
				accessor.getCommand().name(),
				Instant.now()
		);
		try {
			rabbitTemplate.convertAndSend(RabbitConfig.WS_PRESEND_QUEUE, event);
		} catch (Exception ex) {
			log.warn("Failed to publish counselor preSend event", ex);
		}
	}

	@Override
	public void handlePostSend(StompHeaderAccessor accessor) {
		WsInterceptorEvent event = new WsInterceptorEvent(
				role(),
				"POSTSEND",
				accessor.getDestination(),
				accessor.getSessionId(),
				accessor.getCommand().name(),
				Instant.now()
		);
		try {
			rabbitTemplate.convertAndSend(RabbitConfig.WS_POSTSEND_QUEUE, event);
		} catch (Exception ex) {
			log.warn("Failed to publish counselor postSend event", ex);
		}
	}
}
