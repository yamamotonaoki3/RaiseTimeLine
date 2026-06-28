package com.raisetimeline.api.exception;

public class SelfFollowException extends RuntimeException {

    public SelfFollowException(String message) {
        super(message);
    }
}
