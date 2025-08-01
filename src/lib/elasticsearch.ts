// lib/elasticsearch.ts
import { Client } from '@elastic/elasticsearch'

export const esClient = new Client({
  node: 'http://139.196.186.249:9200',
  auth: {
    username: 'elastic',
    password: 'elastic123'
  }
})