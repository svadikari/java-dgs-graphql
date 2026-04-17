package com.shyam.books.data.fetchers;


import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsData;
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment;
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
import com.shyam.books.mappers.BooksMapper;
import com.shyam.books.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@DgsComponent
@RequiredArgsConstructor
public class BooksDataFetcher {
    private final BookRepository bookRepository;
    private final BooksMapper booksMapper;
    private final RestClientGraphQLClient userWebClientGraphQLClient;

    String userQuery = "query GetUser($userId: ID!) { user(id: $userId) { name } }";

    @DgsQuery(field = DgsConstants.QUERY.Books)
    public Iterable<Book> getBooks() {
        return booksMapper.toBookDtos(bookRepository.findAll());
    }

    @DgsData(parentType = DgsConstants.BOOK.TYPE_NAME, field = DgsConstants.BOOK.Author)
    public Author populateAuthor(DgsDataFetchingEnvironment environment) {
        Book book = environment.getSource();
        assert book != null;
        Map<String, Object> variables = new HashMap<>();
        variables.put("userId", book.getAuthorId());

        GraphQLResponse graphQLResponse = userWebClientGraphQLClient.executeQuery(userQuery, variables);
        UserDto userDto = graphQLResponse.extractValueAsObject("user", UserDto.class);
        return userDto == null ? null : Author.newBuilder().name(userDto.name()).build();
    }

    @DgsMutation
    public Book createBook(@InputArgument CreateBook book) {
        return booksMapper.toBookDto(bookRepository.save(booksMapper.toEntity(book)));
    }
}
