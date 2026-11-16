package com.diennng.truyen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication: Spring tự quét các class trong package com.diennng.truyen
// (Controller, Repository, ...) và tạo sẵn object cho bạn dùng.
@SpringBootApplication
public class TruyenApplication {

    public static void main(String[] args) {
        SpringApplication.run(TruyenApplication.class, args);
    }
}
