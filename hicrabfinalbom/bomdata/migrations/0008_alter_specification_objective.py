# Generated by Django 4.0.6 on 2024-10-09 07:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bomdata', '0007_alter_specification_objective'),
    ]

    operations = [
        migrations.AlterField(
            model_name='specification',
            name='objective',
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
