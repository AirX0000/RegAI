provider "aws" {
  region = "us-west-2"
}

resource "aws_db_instance" "default" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.micro"
  db_name              = "regai"
  username             = "postgres"
  password             = "changeme"
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
}

resource "aws_s3_bucket" "backups" {
  bucket = "regai-backups"
}
