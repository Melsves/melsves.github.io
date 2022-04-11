FROM ruby

WORKDIR /opt
COPY Gemfile Gemfile.lock ./
RUN bundle install



