## Swagger 사용법

```tsx
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@ApiTags('users') // 그룹 이름
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'The record has been successfully created.', type: User })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Found user', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

> @ApiTags() : Swagger UI에서 API 그룹을 나누는 탭 이름
> @ApiOperation() : 해당 엔드포인트에 대한 간단 설명
> @ApiResponse() : 가능한 응답 코드 및 응답 타입/설명
> @ApiParam(), @ApiQuery() 등으로 경로·쿼리 파라미터 문서화

```bash
http://localhost:3000/api-docs
```
