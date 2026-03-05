package com.ero.repository;

import com.ero.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByUsername(String username);
    
    List<User> findByRole(User.UserRole role);
    
    List<User> findByRoleAndIsActiveTrue(User.UserRole role);
    
    boolean existsByUsername(String username);
    
    // Leaderboard queries
    List<User> findByRegionAndRoleOrderByPointsDesc(String region, User.UserRole role);
    
    List<User> findByRoleOrderByPointsDesc(User.UserRole role);
    
    @Query("SELECT u FROM User u WHERE u.role = ?1 AND u.region = ?2 ORDER BY u.points DESC")
    List<User> findTopByRegionAndRole(User.UserRole role, String region);
}
