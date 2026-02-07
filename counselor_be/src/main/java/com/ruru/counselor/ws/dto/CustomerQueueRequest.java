package com.ruru.counselor.ws.dto;

public class CustomerQueueRequest {
	private String customerId;
	private String name;
	private String preview;

	public CustomerQueueRequest() {
	}

	public CustomerQueueRequest(String customerId, String name, String preview) {
		this.customerId = customerId;
		this.name = name;
		this.preview = preview;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPreview() {
		return preview;
	}

	public void setPreview(String preview) {
		this.preview = preview;
	}
}
