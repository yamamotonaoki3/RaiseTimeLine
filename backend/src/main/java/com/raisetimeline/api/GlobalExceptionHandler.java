package com.raisetimeline.api;

import com.raisetimeline.api.exception.DuplicateDisplayNameException;
import com.raisetimeline.api.exception.DuplicateEmailException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(
                                FieldError::getField,
                                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid value",
                                (a, b) -> a
                        ),
                        map -> map.entrySet().stream()
                                .map(e -> Map.of("field", e.getKey(), "message", e.getValue()))
                                .collect(Collectors.toList())
                ));
        return Map.of("status", 400, "errors", errors);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleDuplicateEmail(DuplicateEmailException ex) {
        return Map.of("status", 409, "message", ex.getMessage());
    }

    @ExceptionHandler(DuplicateDisplayNameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleDuplicateDisplayName(DuplicateDisplayNameException ex) {
        return Map.of("status", 409, "message", ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> handleBadCredentials(BadCredentialsException ex) {
        return Map.of("status", 401, "message", "メールアドレスまたはパスワードが正しくありません");
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public void handleAccessDenied(AccessDeniedException ex) throws AccessDeniedException {
        throw ex;
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public void handleAuthentication(AuthenticationException ex) throws AuthenticationException {
        throw ex;
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleUnexpected(Exception ex) {
        return Map.of("status", 500, "message", "予期しないエラーが発生しました");
    }
}
