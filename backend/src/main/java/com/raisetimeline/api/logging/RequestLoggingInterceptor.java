package com.raisetimeline.api.logging;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Set;
import net.logstash.logback.argument.StructuredArguments;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger ACCESS_LOG = LoggerFactory.getLogger("ACCESS_LOG");

    private static final String START_TIME_ATTRIBUTE = "requestStartTimeMillis";

    private static final Set<String> EXCLUDED_ENDPOINTS = Set.of(
            "/api/posts/new-count"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex) {

        if (EXCLUDED_ENDPOINTS.contains(request.getRequestURI())) {
            return;
        }

        long startTime = (long) request.getAttribute(START_TIME_ATTRIBUTE);
        long durationMs = System.currentTimeMillis() - startTime;

        String className = null;
        String methodName = null;
        if (handler instanceof HandlerMethod handlerMethod) {
            className = handlerMethod.getBeanType().getSimpleName();
            methodName = handlerMethod.getMethod().getName();
        }

        String userId = resolveMaskedUserId();

        ACCESS_LOG.info("api_request",
                StructuredArguments.kv("user_id", userId),
                StructuredArguments.kv("class_name", className),
                StructuredArguments.kv("method_name", methodName),
                StructuredArguments.kv("http_method", request.getMethod()),
                StructuredArguments.kv("endpoint", request.getRequestURI()),
                StructuredArguments.kv("http_status", response.getStatus()),
                StructuredArguments.kv("duration_ms", durationMs));
    }

    private String resolveMaskedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return LogMaskUtil.maskEmail(authentication.getName());
    }
}
