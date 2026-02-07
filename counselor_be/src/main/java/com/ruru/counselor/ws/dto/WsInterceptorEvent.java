package com.ruru.counselor.ws.dto;

import java.time.Instant;

public class WsInterceptorEvent {
	private String role;
	private String phase;
	private String destination;
	private String sessionId;
	private String command;
	private Instant occurredAt;

	public WsInterceptorEvent() {
	}

	public WsInterceptorEvent(String role, String phase, String destination, String sessionId, String command, Instant occurredAt) {
		this.role = role;
		this.phase = phase;
		this.destination = destination;
		this.sessionId = sessionId;
		this.command = command;
		this.occurredAt = occurredAt;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getPhase() {
		return phase;
	}

	public void setPhase(String phase) {
		this.phase = phase;
	}

	public String getDestination() {
		return destination;
	}

	public void setDestination(String destination) {
		this.destination = destination;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public String getCommand() {
		return command;
	}

	public void setCommand(String command) {
		this.command = command;
	}

	public Instant getOccurredAt() {
		return occurredAt;
	}

	public void setOccurredAt(Instant occurredAt) {
		this.occurredAt = occurredAt;
	}
}
