package com.shyam.users.data.fetchers;

import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsMutation;
import com.netflix.graphql.dgs.DgsQuery;
import com.netflix.graphql.dgs.InputArgument;
import com.shyam.users.dto.types.CreateUser;
import com.shyam.users.dto.types.User;
import com.shyam.users.entities.UserEntity;
import com.shyam.users.mappers.UsersMapper;
import com.shyam.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@DgsComponent
@RequiredArgsConstructor
public class UsersDataFetcher {
  private final UserRepository userRepository;
  private final UsersMapper usersMapper;

  @DgsQuery
  public Iterable<User> users() {
    return usersMapper.toDtos(userRepository.findAll());
  }

  @DgsQuery
  public User user(@InputArgument String id) {
    return usersMapper.toDto(userRepository.findById(Long.valueOf(id)).orElse(UserEntity.builder().build()));
  }

  @DgsMutation
  public User createUser(@InputArgument CreateUser user) {
    return usersMapper.toDto(userRepository.save(usersMapper.toEntity(user)));
  }
}
