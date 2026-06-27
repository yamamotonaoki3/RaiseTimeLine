package com.raisetimeline.api.comment;

import com.raisetimeline.api.like.PostCount;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommentMapper {

    List<CommentResponse> findByPostId(@Param("postId") Long postId);

    Optional<CommentResponse> findById(@Param("id") Long id);

    void insert(Comment comment);

    void delete(@Param("id") Long id);

    List<PostCount> countByPostIds(@Param("postIds") List<Long> postIds);
}
