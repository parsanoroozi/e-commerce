package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findAllByOrderByDisplayOrderAscNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
