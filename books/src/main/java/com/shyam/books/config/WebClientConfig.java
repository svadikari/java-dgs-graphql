package com.shyam.books.config;

import com.netflix.graphql.dgs.client.RestClientGraphQLClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Slf4j
@Configuration
public class WebClientConfig {

    @Value("${users-api.base_url}")
    private String usersApiBaseUrl;

    @Value("${reviews-api.base_url}")
    private String reviewsApiBaseUrl;

    @Bean(name = "userWebClientGraphQLClient")
    public RestClientGraphQLClient userWebClientGraphQLClient() {
        return new RestClientGraphQLClient(RestClient.builder().baseUrl(usersApiBaseUrl).build());
    }

    @Bean(name = "reviewsWebClientGraphQLClient")
    public RestClientGraphQLClient reviewsWebClientGraphQLClient() {
        return new RestClientGraphQLClient(RestClient.builder().baseUrl(reviewsApiBaseUrl).build());
    }
}
