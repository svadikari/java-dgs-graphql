package com.shyam.dgs.graphql.books.mappers;

import com.shyam.dgs.graphql.codegen.types.Book;
import com.shyam.dgs.graphql.codegen.types.CreateBook;
import com.shyam.dgs.graphql.books.entities.BookEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BooksMapper {
    Iterable<Book> toBookDtos(Iterable<BookEntity> bookEntities);
    Book toBookDto(BookEntity bookEntity);
    BookEntity toEntity(CreateBook book);
}
