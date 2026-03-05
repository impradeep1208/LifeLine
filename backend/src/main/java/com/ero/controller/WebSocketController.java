package com.ero.controller;

import com.ero.dto.LocationUpdate;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/location/ambulance")
    @SendTo("/topic/ambulance/location")
    public LocationUpdate handleAmbulanceLocation(@Payload LocationUpdate location) {
        return location;
    }

    @MessageMapping("/location/traffic")
    @SendTo("/topic/traffic/location")
    public LocationUpdate handleTrafficLocation(@Payload LocationUpdate location) {
        return location;
    }
}
