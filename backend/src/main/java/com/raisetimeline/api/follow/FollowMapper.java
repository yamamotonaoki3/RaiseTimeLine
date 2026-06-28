package com.raisetimeline.api.follow;

import com.raisetimeline.api.user.User;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FollowMapper {

    void insert(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    void delete(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    boolean exists(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    List<User> findFollowers(@Param("followeeId") Long followeeId);

    List<User> findFollowing(@Param("followerId") Long followerId);

    long countFollowers(@Param("followeeId") Long followeeId);

    long countFollowing(@Param("followerId") Long followerId);
}
