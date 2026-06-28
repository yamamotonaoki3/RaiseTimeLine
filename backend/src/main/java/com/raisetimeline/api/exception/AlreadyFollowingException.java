package com.raisetimeline.api.exception;

public class AlreadyFollowingException extends RuntimeException {

    public AlreadyFollowingException(String message) {
        super(message);
    }
}
