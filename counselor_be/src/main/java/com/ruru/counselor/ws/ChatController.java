package com.ruru.counselor.ws;

import com.ruru.counselor.config.RabbitConfig;
import com.ruru.counselor.ws.dto.ChatMessage;
import com.ruru.counselor.ws.dto.CustomerQueueRequest;
import com.ruru.counselor.ws.dto.CustomerStatusEvent;
import java.time.Instant;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Value;

@Controller
public class ChatController {

	private final SimpMessagingTemplate messagingTemplate;
	private final RabbitTemplate rabbitTemplate;
	private final String counselorId;

	public ChatController(SimpMessagingTemplate messagingTemplate,
			RabbitTemplate rabbitTemplate,
			@Value("${counselor.id:default}") String counselorId) {
		this.messagingTemplate = messagingTemplate;
		this.rabbitTemplate = rabbitTemplate;
		this.counselorId = counselorId;
	}

	@MessageMapping("/chat.send")
	public void sendChat(ChatMessage message) {
		if (message == null || message.getRoomId() == null) {
			return;
		}
		String destination = "/topic/chat/" + message.getRoomId();
		messagingTemplate.convertAndSend(destination, message);
	}

	@MessageMapping("/customer/status")
	public void customerStatus(CustomerStatusEvent event) {
		if (event == null || event.getCustomerId() == null || event.getStatus() == null) {
			return;
		}
		event.setOccurredAt(Instant.now());
		String routingKey = RabbitConfig.counselorRoutingKey(counselorId);
		rabbitTemplate.convertAndSend(RabbitConfig.CUSTOMER_STATUS_EXCHANGE, routingKey, event);
	}

	@MessageMapping("/customer/request")
	public void customerRequest(CustomerQueueRequest request) {
		if (request == null || request.getCustomerId() == null || request.getName() == null) {
			return;
		}
		messagingTemplate.convertAndSend("/topic/counselor/waiting", request);
	}
}
