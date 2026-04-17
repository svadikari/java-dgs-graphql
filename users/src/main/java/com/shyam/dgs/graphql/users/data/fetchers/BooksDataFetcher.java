package com.shyam.dgs.graphql.users.data.fetchers;

import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsMutation;
import com.netflix.graphql.dgs.DgsQuery;
import com.netflix.graphql.dgs.InputArgument;
import com.shyam.dgs.graphql.codegen.DgsConstants;
import com.shyam.dgs.graphql.codegen.types.Book;
import com.shyam.dgs.graphql.codegen.types.CreateBook;
import com.shyam.dgs.graphql.users.mappers.BooksMapper;
import com.shyam.dgs.graphql.users.repository.BookRepository;
import lombok.RequiredArgsConstructor;

@DgsComponent
@RequiredArgsConstructor
public class BooksDataFetcher {
  private final BookRepository bookRepository;
  private final BooksMapper booksMapper;

  @DgsQuery(field = DgsConstants.QUERY.Books)
  public Iterable<Book> getBooks() {
    return booksMapper.toBookDtos(bookRepository.findAll());
  }

  @DgsMutation
  public Book createBook(@InputArgument CreateBook book) {
    return booksMapper.toBookDto(bookRepository.save(booksMapper.toEntity(book)));
  }
}
