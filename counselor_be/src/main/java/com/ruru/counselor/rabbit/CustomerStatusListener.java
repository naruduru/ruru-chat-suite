package com.ruru.counselor.rabbit;

import com.ruru.counselor.ws.dto.CustomerStatusEvent;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class CustomerStatusListener {

	private final SimpMessagingTemplate messagingTemplate;
	private final String counselorId;

	public CustomerStatusListener(SimpMessagingTemplate messagingTemplate,
			@Value("${counselor.id:default}") String counselorId) {
		this.messagingTemplate = messagingTemplate;
		this.counselorId = counselorId;
	}

	@RabbitListener(queues = "#{customerStatusQueue.name}")
	public void handleCustomerStatus(CustomerStatusEvent event,
			@Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
		if (event == null) {
			return;
		}
		String expectedKey = "counselor." + counselorId;
		if (!expectedKey.equals(routingKey)) {
			return;
		}
		messagingTemplate.convertAndSend("/topic/counselor/status", event);
	}
}
