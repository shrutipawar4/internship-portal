package com.example.demo.config;

import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create admin user only if not exists - SINGLE POINT OF ADMIN CREATION
        if (!userRepository.findByEmail("admin@skillintern.com").isPresent()) {
            User admin = new User();
            admin.setFullName("System Administrator");
            admin.setEmail("admin@skillintern.com");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setPhone("9876543210");
            admin.setRole(Role.ADMIN);
            
            userRepository.save(admin);
            System.out.println("✅ Admin user created successfully with email: admin@skillintern.com");
        } else {
            System.out.println("ℹ️ Admin user already exists - skipping creation");
        }
        
        // Optional: Remove any duplicate admins
        removeDuplicateAdmins();
    }
    
    private void removeDuplicateAdmins() {
        // Find all admins
        java.util.List<User> admins = userRepository.findByRole(Role.ADMIN);
        
        if (admins.size() > 1) {
            System.out.println("⚠️ Found " + admins.size() + " admin users. Keeping only first one.");
            
            // Keep the first admin, delete others
            for (int i = 1; i < admins.size(); i++) {
                User duplicateAdmin = admins.get(i);
                System.out.println("🗑️ Removing duplicate admin: " + duplicateAdmin.getEmail() + " (ID: " + duplicateAdmin.getId() + ")");
                userRepository.delete(duplicateAdmin);
            }
            System.out.println("✅ Duplicate admins removed successfully");
        }
    }
}