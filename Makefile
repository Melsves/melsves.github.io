

.PHONY: build watch
build:
	docker build . -t flappybird

watch: build
	docker run -v $$(pwd):/opt -p 8080:8080 flappybird jekyll build --watch
