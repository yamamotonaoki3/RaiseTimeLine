package com.raisetimeline.api.like;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LikeMapper {

    void insert(@Param("postId") Long postId, @Param("userId") Long userId);

    void delete(@Param("postId") Long postId, @Param("userId") Long userId);

    boolean exists(@Param("postId") Long postId, @Param("userId") Long userId);

    List<PostCount> countByPostIds(@Param("postIds") List<Long> postIds);

    List<Long> likedPostIdsByUser(
            @Param("postIds") List<Long> postIds,
            @Param("userId") Long userId);
}
