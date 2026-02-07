package com.ruru.counselor.ws.dto;

import java.time.Instant;

public class CustomerStatusEvent {
	public enum Status {
		LEFT,
		RETURNED
	}

	private String customerId;
	private Status status;
	private Instant occurredAt;

	public CustomerStatusEvent() {
	}

	public CustomerStatusEvent(String customerId, Status status, Instant occurredAt) {
		this.customerId = customerId;
		this.status = status;
		this.occurredAt = occurredAt;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public Status getStatus() {
		return status;
	}

	public void setStatus(Status status) {
		this.status = status;
	}

	public Instant getOccurredAt() {
		return occurredAt;
	}

	public void setOccurredAt(Instant occurredAt) {
		this.occurredAt = occurredAt;
	}
}
