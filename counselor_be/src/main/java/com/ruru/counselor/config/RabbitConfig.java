package com.ruru.counselor.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

	public static final String WS_PRESEND_QUEUE = "ws.presend";
	public static final String WS_POSTSEND_QUEUE = "ws.postsend";
	public static final String CUSTOMER_STATUS_QUEUE = "customer.status.all";
	public static final String CUSTOMER_STATUS_EXCHANGE = "customer.status.exchange";
	public static final String CUSTOMER_STATUS_ROUTING_KEY_PREFIX = "counselor.";
	public static final String CHAT_EXCHANGE = "chat.exchange";
	public static final String CHAT_AUDIT_QUEUE = "chat.audit";
	public static final String CHAT_ROUTING_KEY_PREFIX = "room.";

	public static String counselorRoutingKey(String counselorId) {
		return CUSTOMER_STATUS_ROUTING_KEY_PREFIX + counselorId;
	}

	public static String chatRoutingKey(String roomId) {
		return CHAT_ROUTING_KEY_PREFIX + roomId;
	}

	@Bean
	public Queue wsPreSendQueue() {
		return new Queue(WS_PRESEND_QUEUE, true);
	}

	@Bean
	public Queue wsPostSendQueue() {
		return new Queue(WS_POSTSEND_QUEUE, true);
	}

	@Bean
	public Queue customerStatusQueue() {
		return new Queue(CUSTOMER_STATUS_QUEUE, true);
	}

	@Bean
	public TopicExchange customerStatusExchange() {
		return new TopicExchange(CUSTOMER_STATUS_EXCHANGE, true, false);
	}

	@Bean
	public Binding customerStatusBinding(Queue customerStatusQueue, TopicExchange customerStatusExchange) {
		return BindingBuilder.bind(customerStatusQueue)
				.to(customerStatusExchange)
				.with("counselor.*");
	}

	@Bean
	public TopicExchange chatExchange() {
		return new TopicExchange(CHAT_EXCHANGE, true, false);
	}

	@Bean
	public Queue chatAuditQueue() {
		return new Queue(CHAT_AUDIT_QUEUE, true);
	}

	@Bean
	public Binding chatAuditBinding(Queue chatAuditQueue, TopicExchange chatExchange) {
		return BindingBuilder.bind(chatAuditQueue)
				.to(chatExchange)
				.with("room.*");
	}

	@Bean
	public ObjectMapper objectMapper() {
		return JsonMapper.builder()
				.addModule(new JavaTimeModule())
				.build();
	}

	@Bean
	public Jackson2JsonMessageConverter jackson2JsonMessageConverter(ObjectMapper objectMapper) {
		return new Jackson2JsonMessageConverter(objectMapper);
	}

	@Bean
	public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
			Jackson2JsonMessageConverter converter) {
		RabbitTemplate template = new RabbitTemplate(connectionFactory);
		template.setMessageConverter(converter);
		return template;
	}

	@Bean
	public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
		RabbitAdmin admin = new RabbitAdmin(connectionFactory);
		admin.setAutoStartup(true);
		return admin;
	}

	@Bean
	public Object rabbitDeclarer(RabbitAdmin rabbitAdmin,
			Queue customerStatusQueue,
			TopicExchange customerStatusExchange,
			Binding customerStatusBinding,
			TopicExchange chatExchange,
			Queue chatAuditQueue,
			Binding chatAuditBinding) {
		rabbitAdmin.declareQueue(customerStatusQueue);
		rabbitAdmin.declareExchange(customerStatusExchange);
		rabbitAdmin.declareBinding(customerStatusBinding);
		rabbitAdmin.declareExchange(chatExchange);
		rabbitAdmin.declareQueue(chatAuditQueue);
		rabbitAdmin.declareBinding(chatAuditBinding);
		return new Object();
	}
}
