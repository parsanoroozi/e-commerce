package personal.ecommercebackend.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    @Around("within(personal.ecommercebackend.service..*)")
    public Object logService(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecution("SERVICE", joinPoint);
    }

    @Around("within(personal.ecommercebackend.controller..*)")
    public Object logController(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecution("CONTROLLER", joinPoint);
    }

    private Object logExecution(String layer, ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String args = formatArgs(joinPoint.getArgs());

        log.debug("{} {}.{}({}) - start", layer, className, methodName, args);
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long durationMs = System.currentTimeMillis() - start;
            log.debug("{} {}.{} - success ({} ms)", layer, className, methodName, durationMs);
            return result;
        } catch (Throwable ex) {
            long durationMs = System.currentTimeMillis() - start;
            log.warn("{} {}.{} - failed ({} ms): {}", layer, className, methodName, durationMs, ex.getMessage());
            throw ex;
        }
    }

    private static String formatArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }
        return Arrays.stream(args)
                .map(arg -> {
                    if (arg == null) {
                        return "null";
                    }
                    String name = arg.getClass().getSimpleName();
                    if (name.contains("password") || name.contains("Password")) {
                        return name + "(***)";
                    }
                    String text = arg.toString();
                    if (text.length() > 120) {
                        return name + "(" + text.substring(0, 117) + "...)";
                    }
                    return text;
                })
                .collect(Collectors.joining(", "));
    }
}
