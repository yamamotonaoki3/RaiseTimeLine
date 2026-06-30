package com.raisetimeline.api;

import com.raisetimeline.api.exception.AlreadyFollowingException;
import com.raisetimeline.api.exception.BadRequestException;
import com.raisetimeline.api.exception.CommentNotFoundException;
import com.raisetimeline.api.exception.DuplicateDisplayNameException;
import com.raisetimeline.api.exception.DuplicateEmailException;
import com.raisetimeline.api.exception.DuplicateUsernameException;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.InvalidRefreshTokenException;
import com.raisetimeline.api.exception.NotFollowingException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.exception.SelfFollowException;
import com.raisetimeline.api.exception.UserNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MissingServletRequestParameterException;
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

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(v -> v.getMessage())
                .findFirst()
                .orElse("入力値が不正です");
        return Map.of("status", 400, "message", message);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleDuplicateEmail(DuplicateEmailException ex) {
        return Map.of("status", 409, "message", ex.getMessage());
    }

    @ExceptionHandler(DuplicateUsernameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleDuplicateUsername(DuplicateUsernameException ex) {
        return Map.of("status", 409, "message", ex.getMessage());
    }

    @ExceptionHandler(DuplicateDisplayNameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleDuplicateDisplayName(DuplicateDisplayNameException ex) {
        return Map.of("status", 409, "message", ex.getMessage());
    }

    @ExceptionHandler(PostNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handlePostNotFound(PostNotFoundException ex) {
        return Map.of("status", 404, "message", ex.getMessage());
    }

    @ExceptionHandler(CommentNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleCommentNotFound(CommentNotFoundException ex) {
        return Map.of("status", 404, "message", ex.getMessage());
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleUserNotFound(UserNotFoundException ex) {
        return Map.of("status", 404, "message", ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleBadRequest(BadRequestException ex) {
        return Map.of("status", 400, "message", ex.getMessage());
    }

    @ExceptionHandler(SelfFollowException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleSelfFollow(SelfFollowException ex) {
        return Map.of("status", 400, "message", ex.getMessage());
    }

    @ExceptionHandler(AlreadyFollowingException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleAlreadyFollowing(AlreadyFollowingException ex) {
        return Map.of("status", 409, "message", ex.getMessage());
    }

    @ExceptionHandler(NotFollowingException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleNotFollowing(NotFollowingException ex) {
        return Map.of("status", 400, "message", ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> handleForbidden(ForbiddenException ex) {
        return Map.of("status", 403, "message", ex.getMessage());
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return Map.of("status", 401, "message", ex.getMessage());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleMissingParam(MissingServletRequestParameterException ex) {
        return Map.of("status", 400, "message", ex.getParameterName() + " パラメータは必須です");
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
