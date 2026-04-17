package com.shyam.dgs.graphql.books.repository;

import com.shyam.dgs.graphql.books.entities.BookEntity;
import org.springframework.data.repository.CrudRepository;

public interface BookRepository extends CrudRepository<BookEntity, Long> {
}
