package com.raisetimeline.api;

import com.raisetimeline.api.config.RequiredEnvironmentValidator;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(Application.class);
        // 本番プロファイルの設定漏れを、Beanが作られる前に分かりやすいエラーで止める。
        // @Component ではなくリスナーとして登録するのは、Bean生成の順序に依存せず
        // 必ずデータソース生成より前に走らせるため。
        app.addListeners(new RequiredEnvironmentValidator());
        app.run(args);
    }
}
