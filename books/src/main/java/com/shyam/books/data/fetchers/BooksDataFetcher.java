package com.shyam.books.data.fetchers;

import com.jayway.jsonpath.TypeRef;
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsData;
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment;
import com.netflix.graphql.dgs.DgsEntityFetcher;
import com.netflix.graphql.dgs.DgsMutation;
import com.netflix.graphql.dgs.DgsQuery;
import com.netflix.graphql.dgs.InputArgument;
import com.netflix.graphql.dgs.client.GraphQLResponse;
import com.netflix.graphql.dgs.client.RestClientGraphQLClient;
import com.shyam.books.dto.DgsConstants;
import com.shyam.books.dto.UserDto;
import com.shyam.books.dto.types.Author;
import com.shyam.books.dto.types.Book;
import com.shyam.books.dto.types.CreateBook;
import com.shyam.books.dto.types.Review;
import com.shyam.books.mappers.BooksMapper;
import com.shyam.books.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;
import org.springframework.util.NumberUtils;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@DgsComponent
@RequiredArgsConstructor
public class BooksDataFetcher {
  private final BookRepository bookRepository;
  private final BooksMapper booksMapper;
  private final RestClientGraphQLClient userWebClientGraphQLClient;
  private final RestClientGraphQLClient reviewsWebClientGraphQLClient;

  String userQuery = "query GetUser($userId: ID!) { user(id: $userId) { name } }";
  String reviewsQuery =
"""
query reviewsByEntityId($entityId: ID!){
  reviews(entityId: $entityId) {
    id
    comment
    rating
    reviewer
  }
}
""";

  @DgsQuery(field = DgsConstants.QUERY.Books)
  public Iterable<Book> getBooks() {
    return booksMapper.toBookDtos(bookRepository.findAll());
  }

  @DgsEntityFetcher(name = DgsConstants.BOOK.TYPE_NAME)
  public Book book(Map<String, Object> values) {
    Object rawId = values.get("id");
    if (rawId == null) {
      return null;
    }

    return bookRepository.findById(Long.valueOf(rawId.toString()))
        .map(booksMapper::toBookDto)
        .orElse(null);
  }

  @DgsData(parentType = DgsConstants.BOOK.TYPE_NAME, field = DgsConstants.BOOK.Authors)
  public List<Author> populateAuthors(DgsDataFetchingEnvironment environment) {
    Book book = environment.getSource();
    assert book != null;

    return StringUtils.hasText(book.getAuthorIds())
        ? Arrays.stream(book.getAuthorIds().split(","))
            .map(
                id -> {
                  Map<String, Object> variables = new HashMap<>();
                  variables.put("userId", id);
                  GraphQLResponse graphQLResponse =
                      userWebClientGraphQLClient.executeQuery(userQuery, variables);
                  UserDto userDto = graphQLResponse.extractValueAsObject("user", UserDto.class);
                  return userDto == null ? null : Author.newBuilder().name(userDto.name()).build();
                })
            .toList()
        : Collections.emptyList();
  }

  @DgsData(parentType = DgsConstants.BOOK.TYPE_NAME, field = DgsConstants.BOOK.Reviews)
  public List<Review> populateReviews(DgsDataFetchingEnvironment environment) {
    Book book = environment.getSource();
    assert book != null;
    Map<String, Object> variables = new HashMap<>();
    variables.put("entityId", book.getId());
    GraphQLResponse graphQLResponse =
        reviewsWebClientGraphQLClient.executeQuery(reviewsQuery, variables);
    List<Map<String, String>> reviews =
        graphQLResponse.extractValueAsObject("reviews", new TypeRef<>() {});
    return CollectionUtils.isEmpty(reviews)
        ? null
        : reviews.stream().map(review ->
            Review.newBuilder().id(review.get("id"))
            .reviewer(review.get("reviewer"))
            .rating(NumberUtils.parseNumber(review.get("rating"), Integer.class))
                    .comment(review.get("comment"))
            .build()
    ).toList();
  }

  @DgsMutation
  public Book createBook(@InputArgument CreateBook book) {
    return booksMapper.toBookDto(bookRepository.save(booksMapper.toEntity(book)));
  }
}
